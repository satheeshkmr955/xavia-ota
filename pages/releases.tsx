import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Heading,
  Button,
  Tag,
  HStack,
  IconButton,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  Flex,
  Tooltip,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormHelperText,
  Select,
} from '@chakra-ui/react';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { SlRefresh, SlPencil } from 'react-icons/sl';

import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { showToast } from '../components/toast';

interface Release {
  path: string;
  runtimeVersion: string;
  timestamp: string;
  size: number;
  commitHash: string | null;
  commitMessage: string | null;
  id: string;
  isHalted?: boolean;
  channel?: string;
  rolloutPercentage?: number;
}

interface Channel {
  label: string;
  value: string;
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [filterReleases, setFilterReleases] = useState<Release[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpenRollback, setIsOpenRollback] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const cancelRollbackRef = useRef<HTMLButtonElement>(null);
  const [isOpenHaltResume, setIsOpenHaltResume] = useState(false);
  const cancelHaltResumeRef = useRef<HTMLButtonElement>(null);
  const [isOpenRollOutPercentage, setIsOpenRollOutPercentage] = useState(false);
  const cancelRollOutPercentage = useRef<HTMLButtonElement>(null);
  const [editRolloutValue, setEditRolloutValue] = useState<number>(0);

  useEffect(() => {
    fetchReleases();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      const tempRelease = releases.filter((release) => {
        return release.channel === selectedChannel;
      });
      setFilterReleases(tempRelease);
    }
  }, [selectedChannel, releases]);

  useEffect(() => {
    if (selectedRelease?.rolloutPercentage && isOpenRollOutPercentage) {
      setEditRolloutValue(selectedRelease.rolloutPercentage);
    }
  }, [selectedRelease, isOpenRollOutPercentage]);

  const fetchReleases = async () => {
    try {
      const response = await fetch('/api/releases');
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      const data = await response.json();
      const releases: Release[] = data.releases || [];
      const channelSet = new Set(releases.map((release) => release?.channel || ''));
      const tempChannelList = Array.from(channelSet).map((channel) => {
        return { label: channel, value: channel };
      });
      setChannelList(tempChannelList);
      if (selectedChannel === null) {
        setSelectedChannel(tempChannelList[0]?.value || null);
      }
      setReleases(data.releases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  const onSelectChannelHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedChannel(newValue);
  };

  const toggleHaltApi = async () => {
    setIsOpenHaltResume(false);
    try {
      const response = await fetch('/api/updateReleaseStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedRelease?.id as string,
          isHalted: !selectedRelease?.isHalted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update release status');
      }

      showToast(
        `Release ${!selectedRelease?.isHalted ? 'halted' : 'resumed'} successfully`,
        'success'
      );
      fetchReleases();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update release status', 'error');
    }
  };

  const rollbackApi = async () => {
    setIsOpenRollback(false);
    try {
      const response = await fetch('/api/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedRelease?.path,
          runtimeVersion: selectedRelease?.runtimeVersion,
          commitHash: selectedRelease?.commitHash,
          commitMessage: selectedRelease?.commitMessage,
          channel: selectedRelease?.channel,
          rolloutPercentage: selectedRelease?.rolloutPercentage,
        }),
      });

      if (!response.ok) {
        throw new Error('Rollback failed');
      }

      showToast('Rollback successful', 'success');
      fetchReleases();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to rollback release', 'error');
    }
  };

  const updateRolloutPercentageApi = async () => {
    setIsOpenRollOutPercentage(false);
    try {
      const response = await fetch('/api/rolloutPercentage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedRelease?.id as string,
          rolloutPercentage: editRolloutValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Rollout percentage failed');
      }

      showToast('Rollout percentage successful', 'success');
      fetchReleases();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update rollout percentage',
        'error'
      );
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Box mx={4}>
          <Flex className="flex-col">
            <HStack justifyContent={'space-between'}>
              <HStack>
                <Heading size="lg">Releases</Heading>
                <IconButton
                  aria-label="Refresh"
                  onClick={fetchReleases}
                  variant="solid"
                  // colorScheme="blue"
                  size="md"
                  icon={<SlRefresh />}
                />
              </HStack>
              <Box>
                <FormControl>
                  <FormLabel>Filter Deployment Channel</FormLabel>
                  <Select
                    placeholder="Select channel"
                    variant="outline"
                    onChange={onSelectChannelHandler}
                    className="capitalize"
                    value={selectedChannel || ''}>
                    {channelList.map((channel) => {
                      return (
                        <option key={channel.value} className="capitalize" value={channel.value}>
                          {channel.label}
                        </option>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>
            </HStack>

            {loading && <Text>Loading...</Text>}
            {error && <Text color="red.500">{error}</Text>}

            {!loading && !error && (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>
                      <Tooltip label={'Runtime Version'}>
                        <Text isTruncated w="4rem">
                          {'Runtime Version'}
                        </Text>
                      </Tooltip>
                    </Th>
                    <Th>Commit Hash</Th>
                    <Th>Commit Message</Th>
                    <Th>Timestamp (UTC)</Th>
                    <Th>File Size</Th>
                    <Th>Channel</Th>
                    <Th>Rollout %</Th>
                    <Th>Actions</Th>
                    <Th>Halt</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filterReleases
                    .sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map((release, index) => (
                      <Tr key={index}>
                        <Td>
                          <Tooltip label={release.path}>
                            <Text isTruncated w="8rem">
                              {release.path}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td>{release.runtimeVersion}</Td>
                        <Td>
                          <Tooltip label={release.commitHash}>
                            <Text isTruncated w="8rem">
                              {release.commitHash}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Tooltip label={release.commitMessage}>
                            <Text isTruncated w="8rem">
                              {release.commitMessage}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td className="min-w-[10rem]">
                          {moment(release.timestamp).utc().format('MMM, Do  HH:mm')}
                        </Td>
                        <Td>{formatFileSize(release.size)}</Td>
                        <Td>
                          <Tooltip label={release.channel}>
                            <Text isTruncated w="5rem" className="capitalize">
                              {release.channel}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Text>{release.rolloutPercentage}%</Text>
                            <IconButton
                              aria-label="Pencil"
                              onClick={() => {
                                setIsOpenRollOutPercentage(true);
                                setSelectedRelease(release);
                              }}
                              disabled={index !== 0}
                              variant="ghost"
                              size="sm"
                              icon={<SlPencil />}
                            />
                          </HStack>
                        </Td>
                        <Td justifyItems="center">
                          {index === 0 ? (
                            <Tag size="lg" colorScheme="green">
                              Active Release
                            </Tag>
                          ) : (
                            <Button
                              variant="solid"
                              colorScheme="orange"
                              size="sm"
                              onClick={async () => {
                                setIsOpenRollback(true);
                                setSelectedRelease(release);
                              }}>
                              Rollback to this release
                            </Button>
                          )}
                        </Td>
                        <Td>
                          <Button
                            colorScheme={release.isHalted ? 'green' : 'red'}
                            disabled={index !== 0}
                            onClick={() => {
                              setIsOpenHaltResume(true);
                              setSelectedRelease(release);
                            }}>
                            {release.isHalted ? 'Resume' : 'Halt'}
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            )}
          </Flex>
        </Box>
        <AlertDialog
          isOpen={isOpenRollback && selectedRelease !== null}
          leastDestructiveRef={cancelRollbackRef}
          onClose={() => setIsOpenRollback(false)}
          isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Rollback Release
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to rollback to this release?
                <Tag size="lg" colorScheme="green" mt={4} padding={4} className="w-full">
                  <Text fontSize="sm">Commit Hash: {selectedRelease?.commitHash}</Text>
                </Tag>
                <Tag size="lg" colorScheme="orange" mt={4} padding={4}>
                  <Text fontSize="sm">
                    This will promote this release to be the active release with a new timestamp.
                  </Text>
                </Tag>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRollbackRef} onClick={() => setIsOpenRollback(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    rollbackApi();
                  }}
                  ml={3}>
                  Rollback
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
        <AlertDialog
          isOpen={isOpenHaltResume && selectedRelease !== null}
          leastDestructiveRef={cancelHaltResumeRef}
          onClose={() => setIsOpenHaltResume(false)}
          isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {selectedRelease?.isHalted ? 'Resume' : 'Halt'} Release
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to {selectedRelease?.isHalted ? 'resume' : 'halt'} this
                release?
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelHaltResumeRef} onClick={() => setIsOpenHaltResume(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme={selectedRelease?.isHalted ? 'green' : 'red'}
                  onClick={() => {
                    toggleHaltApi();
                  }}
                  ml={3}>
                  {selectedRelease?.isHalted ? 'Resume' : 'Halt'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
        <AlertDialog
          isOpen={isOpenRollOutPercentage && selectedRelease !== null}
          leastDestructiveRef={cancelRollOutPercentage}
          onClose={() => setIsOpenRollOutPercentage(false)}
          isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Update Rollout Percentage
              </AlertDialogHeader>

              <AlertDialogBody>
                <Text mb={4}>
                  Adjust the rollout percentage for this release. Only the specified percentage of
                  users will receive this update.
                </Text>

                <FormControl>
                  <FormLabel>Rollout Percentage (%)</FormLabel>
                  <NumberInput
                    max={100}
                    min={0}
                    value={editRolloutValue}
                    onChange={(valString) => setEditRolloutValue(parseInt(valString, 10) || 0)}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Set 0 to 100. 100 will deliver to all users.</FormHelperText>
                </FormControl>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button
                  ref={cancelRollOutPercentage}
                  onClick={() => setIsOpenRollOutPercentage(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme={'red'}
                  onClick={() => {
                    updateRolloutPercentageApi();
                  }}
                  ml={3}>
                  Update
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Layout>
    </ProtectedRoute>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
